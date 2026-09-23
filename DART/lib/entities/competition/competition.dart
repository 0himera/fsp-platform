/// Barrel-файл слайса `entities/competition` — единственная дверь наружу.
///
/// Правила те же, что и для athlete: импортируем только этот файл.
/// `CompetitionStage` экспортируется вместе с моделью (`stage` нужен и
/// карточке, и строке истории).
library;

export 'model/competition.dart';
export 'model/competition_detail.dart';
export 'model/competition_draft.dart';
export 'model/competition_http_service.dart';
export 'model/competition_enums.dart'
    show CompetitionLevel, CompetitionFormat, CompetitionStatus;
export 'model/competition_service.dart';
export 'model/protocol_entry.dart';
